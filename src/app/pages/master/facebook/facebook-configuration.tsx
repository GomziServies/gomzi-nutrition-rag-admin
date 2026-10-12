import { useState } from 'react'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import * as FGGroupAPIs from '../../../Functions/FGGroup'
import {
	connectedAccounts,
	IConnectedAccounts,
} from '../../../modules/fgiit/admin/components/settings/SettingsModel'

const MasterFacebookConfiguration = () => {
	const [data, setData] = useState<IConnectedAccounts>(connectedAccounts)
	const [loading, setLoading] = useState(false)
	const url_path: string = window.origin + '/auth/facebook/callback'
	const updateData = (fieldsToUpdate: Partial<IConnectedAccounts>) => {
		const updatedData = { ...data, ...fieldsToUpdate }
		setData(updatedData)
	}

	const click = () => {
		setLoading(true)
		setTimeout(() => {
			setLoading(false)
		}, 1000)
	}

	const authorizeFacebookAccount = () => {
		FGGroupAPIs.getFacebookOAuthURL({
			redirect_uri: url_path,
		}).then((response) => {
			if (response?.data?.facebook_oauth_url) {
				window.location.href = response.data.facebook_oauth_url
			}
		})
	}

	const handleSaveChanges = () => {
		click()
		authorizeFacebookAccount()
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Facebook Configuration</PageTitle>
			<div className='row g-5 g-xl-5'>
				<div className='col-md-12'>
					<div className='card mb-5 mb-xl-10'>
						<div
							className='card-header border-0 cursor-pointer'
							role='button'
							data-bs-toggle='collapse'
							data-bs-target='#kt_account_connected_accounts'
							aria-expanded='true'
							aria-controls='kt_account_connected_accounts'>
							<div className='card-title m-0'>
								<h3 className='fw-bolder m-0'>Facebook</h3>
							</div>
						</div>

						<div
							id='kt_account_connected_accounts'
							className='collapse show'>
							<div className='card-body border-top p-9'>
								<div className='py-2'>
									<div className='d-flex flex-stack'>
										<div className='d-flex'>
											<img
												src={toAbsoluteUrl('/media/svg/brand-logos/facebook-4.svg')}
												className='w-30px me-6'
												alt=''
											/>

											<div className='d-flex flex-column'>
												<a
													href='#'
													className='fs-5 text-dark  fw-bolder'>
													Facebook
												</a>
												<div className='fs-6 fw-bold text-gray-400'>
													Authorized Facebook Account
												</div>
											</div>
										</div>
										<div className='d-flex justify-content-end'>
											<div className='card-footer d-flex justify-content-end py-6 px-9'>
												<button
													onClick={handleSaveChanges}
													className='btn btn-primary'>
													{!loading && 'Connect'}
													{loading && (
														<span
															className='indicator-progress'
															style={{ display: 'block' }}>
															Please wait...{' '}
															<span className='spinner-border spinner-border-sm align-middle ms-2'></span>
														</span>
													)}
												</button>
											</div>


											{/* <div className='form-check form-check-solid form-switch'>
												<input
													className='form-check-input w-45px h-30px'
													type='checkbox'
													id='facebookswitch'
													checked={data.facebook}
													onChange={() =>
														updateData({
															facebook: !data.facebook,
														})
													}
												/>
												<label
													className='form-check-label'
													htmlFor='facebookswitch'></label>
											</div> */}
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

export { MasterFacebookConfiguration }
