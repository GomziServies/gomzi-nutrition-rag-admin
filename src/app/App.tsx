import { Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { Outlet } from 'react-router-dom'
import { I18nProvider } from '../_metronic/i18n/i18nProvider'
import { LayoutProvider, LayoutSplashScreen } from '../_metronic/layout/core'
import { MasterInit } from '../_metronic/layout/MasterInit'
import { AuthInit } from './modules/auth'

const App = () => {
	return (
		<Suspense fallback={<LayoutSplashScreen />}>
			<I18nProvider>
				<LayoutProvider>
					<AuthInit>
						<Outlet />
						<MasterInit />
						<Toaster
							position='top-right'
							reverseOrder={false}
						/>
					</AuthInit>
				</LayoutProvider>
			</I18nProvider>
		</Suspense>
	)
}

export { App }
