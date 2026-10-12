import { useIntl } from 'react-intl'
import { PageTitle } from '../../../../_metronic/layout/core'
import TableButton from '../../../components/TableButton'

const AddTrainerPage = () => (
	<>
		<h1 className='fw-bold text-dark fs-1 mb-6 '>Add Trainer</h1>
		<div className='row'>
			<div className='col-12 mt-3'>
				<div className='card'>
					<div className='card-body'>
						<div className='row'>
							<div className='col-md-12 fv-row mb-7'>
								<label
									htmlFor='dfsf'
									className='required fw-bold fs-6 mb-2'>
									Full Name
								</label>
								<input
									placeholder='Full Name'
									type='Number'
									className='form-control form-control-solid mb-3 mb-lg-0'
									autoComplete='off'
								/>
							</div>
							<div className='col-md-6 fv-row mb-7'>
								<label
									htmlFor='dfsf'
									className='required fw-bold fs-6 mb-2'>
									Email
								</label>
								<input
									placeholder='Email'
									type='email'
									className='form-control form-control-solid mb-3 mb-lg-0'
									autoComplete='off'
								/>
							</div>
							<div className='col-md-6 fv-row mb-7'>
								<label
									htmlFor='dfsf'
									className='required fw-bold fs-6 mb-2'>
									Mobile no.
								</label>
								<input
									placeholder='Mobile no'
									type='number'
									className='form-control form-control-solid mb-3 mb-lg-0'
									autoComplete='off'
								/>
							</div>
							<div className='col-md-6 fv-row mb-7'>
								<label
									htmlFor='dfsf'
									className='required fw-bold fs-6 mb-2'>
									Gender
								</label>
								<select
									className='form-control form-select form-control-solid mb-3 mb-lg-0'
									autoComplete='off'>
									<option>Select Gender</option>
									<option>Male</option>
									<option>Female</option>
									<option>Other</option>
								</select>
							</div>
							<div className='col-md-6 fv-row mb-7'>
								<label
									htmlFor='dfsf'
									className='required fw-bold fs-6 mb-2'>
									Birth Date
								</label>
								<input
									placeholder='Birth Date'
									type='date'
									className='form-control form-control-solid mb-3 mb-lg-0'
									autoComplete='off'
								/>
							</div>
							<div className='col-md-6 fv-row mb-7'>
								<label
									htmlFor='dfsf'
									className='required fw-bold fs-6 mb-2'>
									Designation
								</label>
								<select
									className='form-control form-select form-control-solid mb-3 mb-lg-0'
									autoComplete='off'>
									<option>Select Designation</option>
									<option>General Trainer</option>
									<option>Personal Trainer</option>
								</select>
							</div>
							<div className='col-md-6 fv-row mb-7'>
								<label
									htmlFor='dfsf'
									className='required fw-bold fs-6 mb-2'>
									Commission
								</label>
								<select
									className='form-control form-select form-control-solid mb-3 mb-lg-0'
									autoComplete='off'>
									<option>Select Commission</option>
									<option>15%</option>
									<option>10%</option>
									<option>05%</option>
								</select>
							</div>
							<div className='col-md-12 fv-row mb-7'>
								<TableButton
									action="add"
									text="Create Trainer"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</>
)

const AddTrainer = () => {
	const intl = useIntl()
	return (
		<>
			<PageTitle breadcrumbs={[]}>Dashboard</PageTitle>
			<AddTrainerPage />
		</>
	)
}

export { AddTrainer }
