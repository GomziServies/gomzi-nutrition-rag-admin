/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import { useIntl } from 'react-intl'
import { PageTitle } from '../../../../../_metronic/layout/core'

const FitnessView = () => {
	const intl = useIntl()
	return (
		<>
			<PageTitle breadcrumbs={[]}>Fitness Plan</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-12'>
									<div className='row'>
										<div className='col-md-3 fv-row mb-7'>
											<label
												htmlFor='ddd'
												className='required fw-bold fs-6 mb-2'>
												USER ID
											</label>
											<input
												placeholder='USER ID'
												type='text'
												className='form-control form-control-solid mb-3 mb-lg-0'
												autoComplete='off'
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<label
												htmlFor='ddd'
												className='required fw-bold fs-6 mb-2'>
												Name
											</label>
											<input
												placeholder='Name'
												type='text'
												className='form-control form-control-solid mb-3 mb-lg-0'
												autoComplete='off'
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<label
												htmlFor='ddd'
												className='required fw-bold fs-6 mb-2'>
												Email
											</label>
											<input
												placeholder='Email'
												type='text'
												className='form-control form-control-solid mb-3 mb-lg-0'
												autoComplete='off'
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<label
												htmlFor='ddd'
												className='required fw-bold fs-6 mb-2'>
												Phone number
											</label>
											<input
												placeholder='Phone number'
												type='text'
												className='form-control form-control-solid mb-3 mb-lg-0'
												autoComplete='off'
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<label
												htmlFor='ddd'
												className='required fw-bold fs-6 mb-2'>
												Preference Updated On
											</label>
											<input
												placeholder='Preference Updated On'
												type='text'
												className='form-control form-control-solid mb-3 mb-lg-0'
												autoComplete='off'
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<label
												htmlFor='ddd'
												className='required fw-bold fs-6 mb-2'>
												Diet For
											</label>
											<input
												placeholder='Diet For'
												type='text'
												className='form-control form-control-solid mb-3 mb-lg-0'
												autoComplete='off'
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<label
												htmlFor='ddd'
												className='required fw-bold fs-6 mb-2'>
												Food Type
											</label>
											<input
												placeholder='Food Type'
												type='text'
												className='form-control form-control-solid mb-3 mb-lg-0'
												autoComplete='off'
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<label
												htmlFor='ddd'
												className='required fw-bold fs-6 mb-2'>
												Idle Weight (in KG)
											</label>
											<input
												placeholder='Idle Weight'
												type='text'
												className='form-control form-control-solid mb-3 mb-lg-0'
												autoComplete='off'
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
export { FitnessView }
