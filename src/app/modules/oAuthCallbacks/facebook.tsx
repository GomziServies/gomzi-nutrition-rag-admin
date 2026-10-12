/* eslint-disable jsx-a11y/anchor-is-valid */

import { useEffect, useState } from 'react'
import { toAbsoluteUrl } from '../../../_metronic/helpers'
import * as FGGroupAPI from '../../Functions/FGGroup'

export function FacebookOAuthCallback() {
	// Get Code and State from URL
	const urlParams = new URLSearchParams(window.location.search)

	const [callbackError, setCallbackError] = useState<string | undefined>('')
	const [callbackSuccess, setCallbackSuccess] = useState<string | undefined>('')

	useEffect(() => {
		setCallbackError(undefined)
		setCallbackSuccess(undefined)

		const code: any = urlParams.get('code')
		let state: any = urlParams.get('state')
		const url_path: string = window.origin + '/auth/facebook/callback'

		if (!code || !state) {
			setCallbackError('You are not authorized to access this page. Please go back to portal.')
			return
		}

		state = decodeURIComponent(state)

		// Call FacebookOAuthCallback function from FGGroupAPI
		FGGroupAPI.FacebookOAuthCallback({
			code: code || '',
			state: state || '',
			redirect_uri: url_path || '',
		})
			.then((response) => {
				setCallbackSuccess(response.message)

				setTimeout(() => {
					window.location.href = '/master/dashboard'
				}, 3000)
			})
			.catch((error) => {
				if (error?.data?.error?.message) {
					setCallbackError(error?.data?.error?.message)
				} else {
					setCallbackError(error.message)
				}
			})
	}, [])

	return (
		<div className='d-flex flex-column flex-center flex-column-fluid'>
			<div className='d-flex flex-column flex-center text-center p-10'>
				<div className='card card-flush w-lg-650px py-5'>
					<div className='card-body py-15 py-lg-20'>
						<div className='mb-14'>
							<a
								href='/master/dashboard'
								className=''>
								<img
									alt='Logo'
									src={toAbsoluteUrl('/media/logos/rag-favicon-logo.png')}
									className='h-40px'
								/>
							</a>
						</div>

						<h1 className='fw-bolder text-gray-900 mb-5'>Authorizing your facebook account...</h1>

						<div className='fw-semibold fs-6 text-gray-500 mb-8'>
							Please wait while we authorize your facebook account.
						</div>

						{callbackError && (
							<div className='alert alert-danger'>
								<div className='alert-text'>{callbackError}</div>
							</div>
						)}

						{callbackSuccess && (
							<div className='alert alert-success'>
								<div className='alert-text'>{callbackSuccess}</div>
							</div>
						)}

						<div className='mb-11'>
							<a
								href='/master/dashboard'
								className='btn btn-sm btn-primary'>
								Go to Dashboard
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
