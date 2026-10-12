/* eslint-disable jsx-a11y/anchor-is-valid */
import { useEffect } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { NutritionLogin } from './Login'

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
			{/* begin::Content */}
			<div className='d-flex flex-center flex-column flex-column-fluid p-10 pb-lg-20'>
				{/* begin::Logo */}
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
				<h1 className='mb-12 my-4'>Nutrition Sign In</h1>
				{/* end::Logo */}
				{/* begin::Wrapper */}
				<div className='w-lg-500px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto'>
					<Outlet />
				</div>
				{/* end::Wrapper */}
			</div>
			{/* end::Content */}
		</div>
	)
}

const NutritionAuthPage = () => (
	<Routes>
		<Route element={<AuthLayout />}>
			<Route
				path='login'
				element={<NutritionLogin />}
			/>
			<Route
				index
				element={<NutritionLogin />}
			/>
		</Route>
	</Routes>
)

export { NutritionAuthPage }
