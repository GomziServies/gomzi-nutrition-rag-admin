/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { FC } from 'react'
import { useLayout } from '../../core'
import { AsideFooter } from './AsideFooter'
import { AsideMenu } from './AsideMenu'
import { AsideToolbar } from './AsideToolbar'

const AsideDefault: FC = () => {
	const { classes } = useLayout()

	return (
		<div
			id='kt_aside'
			className='aside'
			data-kt-drawer='true'
			data-kt-drawer-name='aside'
			data-kt-drawer-activate='{default: true, lg: false}'
			data-kt-drawer-overlay='true'
			data-kt-drawer-width="{default:'200px', '300px': '250px'}"
			data-kt-drawer-direction='start'
			data-kt-drawer-toggle='#kt_aside_mobile_toggle'>
			{/* begin::Aside Toolbar */}
			<div
				className='aside-toolbar flex-column-auto'
				id='kt_aside_toolbar'>
				<AsideToolbar />
			</div>
			{/* end::Aside Toolbar */}
			{/* begin::Aside menu */}
			<div className='aside-menu flex-column-fluid'>
				<AsideMenu asideMenuCSSClasses={classes.asideMenu} />
			</div>
			{/* end::Aside menu */}
			{/* begin::Aside footer */}
			<div className='aside-footer flex-column-auto'>
				<AsideFooter />
			</div>
			{/* end::Aside footer */}
		</div>
	)
}

export { AsideDefault }
