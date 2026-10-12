/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import { faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import InputField from '../../../components/InputField'

const HREmployeeRatting = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const employee_id: any = searchParams.get('employee_id')
	const [employeeRatingData, setEmployeeRatingData] = useState<any>({})

	const fetchFitnessData = async () => {
		try {
			const response = await GetEmployees({ id: employee_id })
			const filteredData: any = response.data
			setEmployeeRatingData(filteredData[0])
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchFitnessData()
	}, [])

	return (
		<>
			<PageTitle breadcrumbs={[]}>Employee Details</PageTitle>
			<>
				<div className='card pb-0'>
					<div className='card-body'>
						<div className='row'>
							<div className='col-md-6 fv-row'>
								<InputField
									placeholder='Employee Name'
									type='text'
									className='col-12 fv-row mb-1'
									name='name'
									label='Name :'
									htmlFor='name'
									value={employeeRatingData.name}
									disabled
								/>
							</div>
							<div className='col-md-6 fv-row'>
								<InputField
									placeholder='Employee Email'
									type='text'
									className='col-12 fv-row mb-1'
									name='email'
									label='Email :'
									htmlFor='email'
									value={employeeRatingData.email}
									disabled
								/>
							</div>
						</div>

						<div>
							<li className='fs-4'>
								<b>Overall Percentage : </b> 83.33%
							</li>
							<li className='fs-4'>
								Rating :{' '}
								<b>
									<FontAwesomeIcon
										icon={faStar}
										className='fs-7 pe-1'
									/>
									<FontAwesomeIcon
										icon={faStar}
										className='fs-7 pe-1'
									/>
									<FontAwesomeIcon
										icon={faStar}
										className='fs-7 pe-1'
									/>
									<FontAwesomeIcon
										icon={faStar}
										className='fs-7 pe-1'
									/>
									<FontAwesomeIcon
										icon={faStar}
										className='fs-7'
									/>
								</b>
							</li>
						</div>
					</div>
				</div>
			</>
		</>
	)
}

export { HREmployeeRatting }

