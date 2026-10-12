
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import { GetEmployerApplications } from '../../../Functions/FGGroup'
import { useEffect, useState } from 'react'
import TableButton from '../../../components/TableButton'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const EmployerView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const employer_id: string | any = searchParams.get('employer_id')
	const [formData, setFormData] = useState({
		_id: '',
		name: '',
		email: '',
		mobile: '',
		createdAt: '',
		type: '',
		location: '',
		estimated_salary: '',
		job_post: '',
	})

	const fetchProductData = async () => {
		try {
			const response: any = await GetEmployerApplications({ id: employer_id })
			const data = response.data[0]
			setFormData(data)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchProductData()
	}, [])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Employer Application View</PageTitle>
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
												value={(formData.name)}
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
												value={(formData.email)}
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
												value={(formData.mobile)}
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
												placeholder='Enter Estimated Salary'
												type='text'
												className='fv-row'
												name='estimated_salary'
												label='Estimated Salary'
												htmlFor='estimated_salary'
												value={(formData.estimated_salary)}
												onChange={handleInputChange}
												readOnly
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Enter Job Post'
												type='text'
												className='fv-row'
												name='job_post'
												label='Job Post'
												htmlFor='job_post'
												value={(formData.job_post)}
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
												value={(formData.location)}
												onChange={handleInputChange}
												readOnly
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Enter Job Type'
												type='text'
												className='fv-row'
												name='type'
												label='Job Type'
												htmlFor='type'
												value={(formData.type)}
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
									to='/fgiit/employer-inquiry'
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
export { EmployerView }
