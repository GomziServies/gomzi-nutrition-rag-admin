/* eslint-disable jsx-a11y/anchor-is-valid */
import { useEffect } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { InvestorLogin } from './Login'

const AuthLayout = () => {
	useEffect(() => {
		document.body.style.backgroundImage = 'none'
	}, [])

	return (
		<div
			className='d-flex flex-column flex-column-fluid bgi-position-y-bottom position-x-center bgi-no-repeat bgi-size-contain bgi-attachment-fixed'
			style={{
				backgroundImage: `url(${toAbsoluteUrl('/media/illustrations/sketchy-1/14.png')})`,
			}}>
			<div className='d-flex flex-center flex-column flex-column-fluid p-10 pb-lg-20'>
				<a href='#'>
					<img
						alt='Logo'
						src={toAbsoluteUrl('/media/logos/rag-favicon-logo.png')}
						className='theme-dark-show h-65px'
					/>
					<img
						alt='Logo'
						src={toAbsoluteUrl('/media/logos/rag-favicon-logo.png')}
						className='theme-light-show h-65px'></img>
				</a>
				<h1 className='mb-12 my-4'>Investor Sign In</h1>
				<div className='w-lg-500px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto'>
					<Outlet />
				</div>
			</div>
		</div>
	)
}

const InvestorAuthPage = () => (
	<Routes>
		<Route element={<AuthLayout />}>
			<Route
				path='login'
				element={<InvestorLogin />}
			/>
			<Route
				index
				element={<InvestorLogin />}
			/>
		</Route>
	</Routes>
)

export { InvestorAuthPage }
