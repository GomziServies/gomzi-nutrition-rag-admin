import { FC, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'

const Error404: FC = () => {
	const [adminType, setAdminType] = useState<string | null>(null)

	useEffect(() => {
		const admin_Type = localStorage.getItem('admin')
		setAdminType(admin_Type)
	}, [])

	return (
		<>
			<div className='row justify-content-center align-items-center'>
				<div
					className='col-md-12 text-center p-0'
					style={{ marginTop: '55px' }}>
					{/* begin::Illustration */}
					<div className='mb-3'>
						<img
							src={toAbsoluteUrl('/media/auth/404-error.png')}
							className='mw-100 mh-300px theme-light-show'
							alt=''
						/>
						<img
							src={toAbsoluteUrl('/media/auth/404-error-dark.png')}
							className='mw-100 mh-300px theme-dark-show'
							alt=''
						/>
					</div>
					{/* end::Illustration */}

					{/* begin::Title */}
					<h1 className='fw-bolder fs-2hx text-gray-900 mb-4'>Oops! Something went wrong!</h1>
					{/* end::Title */}

					{/* begin::Text */}
					<div className='fw-semibold fs-6 text-gray-500 mb-7'>We can't find that page.</div>
					{/* end::Text */}
					{/* begin::Link */}
					<div className='mb-0'>
						<Link
							to={'/' + adminType + '/dashboard'}
							className='btn btn-sm btn-primary'>
							Return Home
						</Link>
					</div>
					{/* end::Link */}
				</div>
			</div>
		</>
	)
}

export { Error404 }
