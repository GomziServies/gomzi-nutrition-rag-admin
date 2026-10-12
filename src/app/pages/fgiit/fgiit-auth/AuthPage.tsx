/* eslint-disable jsx-a11y/anchor-is-valid */
import { useEffect } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'
import { FgiitLogin } from './Login'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'

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
                        src={toAbsoluteUrl('/media/logos/fgiit-logo.png')}
                        className='theme-dark-show h-65px'
                    />
                    <img
                        alt='Logo'
                        src={toAbsoluteUrl('/media/logos/fgiit-logo.png')}
                        className='theme-light-show h-65px'
                    />
                </a>
                <h1 className='mb-12 my-4'>FGIIT Sign In</h1>
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

const FgiitLoginAuthPage = () => (
    <Routes>
        <Route element={<AuthLayout />}>
            <Route path='login' element={<FgiitLogin />} />
            <Route index element={<FgiitLogin />} />
        </Route>
    </Routes>
)

export { FgiitLoginAuthPage }
