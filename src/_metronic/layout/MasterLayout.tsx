import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { MenuComponent } from '../assets/ts/components'
import {
	ActivityDrawer,
	DrawerMessenger,
	InviteUsers,
	ThemeModeProvider,
	UpgradePlan,
} from '../partials'
import { RightToolbar } from '../partials/layout/RightToolbar'
import { AsideDefault } from './components/aside/AsideDefault'
import { Content } from './components/Content'
import { Footer } from './components/Footer'
import { HeaderWrapper } from './components/header/HeaderWrapper'
import { ScrollTop } from './components/ScrollTop'
import { PageDataProvider } from './core'

const MasterLayout = () => {
	const location = useLocation()
	useEffect(() => {
		setTimeout(() => {
			MenuComponent.reinitialization()
		}, 500)
	}, [])

	useEffect(() => {
		setTimeout(() => {
			MenuComponent.reinitialization()
		}, 500)
	}, [location.key])

	return (
		<PageDataProvider>
			<ThemeModeProvider>
				<div className='page d-flex flex-row flex-column-fluid'>
					<AsideDefault />
					<div
						className='wrapper d-flex flex-column flex-row-fluid'
						id='kt_wrapper'>
						<HeaderWrapper />

						<div
							id='kt_content'
							className='content d-flex flex-column flex-column-fluid'>
							<div
								className='post d-flex flex-column-fluid'
								id='kt_post'>
								<Content>
									<Outlet />
								</Content>
							</div>
						</div>
						<Footer />
					</div>
				</div>

				{/* begin:: Drawers */}
				<ActivityDrawer />
				<RightToolbar />
				<DrawerMessenger />
				{/* end:: Drawers */}

				{/* begin:: Modals */}
				<InviteUsers />
				<UpgradePlan />
				{/* end:: Modals */}
				<ScrollTop />
			</ThemeModeProvider>
		</PageDataProvider>
	)
}

export { MasterLayout }
