/* eslint-disable react/jsx-no-target-blank */
import { faFacebook, faGoogle, faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import {
	faBox,
	faBullhorn,
	faFileInvoiceDollar,
	faFileLines,
	faHome,
	faPeopleGroup,
	faPhoneAlt,
	faSliders,
	faUserGroup,
	faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'

export function MasterAsideMenuItems() {
	return (
		<>
			<AsideMenuItem
				to='/master/dashboard'
				Icon={faHome}
				title='Dashboard'
			/>
			<AsideMenuItemWithSub
				to=''
				title='Facebook'
				Icon={faUsers}>
				<AsideMenuItem
					to='/master/facebook'
					Icon={faFacebook}
					title='Facebook'
				/>
				<AsideMenuItem
					to='/master/configuration'
					Icon={faSliders}
					title='Configuration'
				/>
			</AsideMenuItemWithSub>

			<AsideMenuItem
				to='/master/google-analytics'
				Icon={faGoogle}
				title='Google Analytics'
			/>
			<AsideMenuItem
				to='/master/fg-group'
				Icon={faUserGroup}
				title='FG Group'
			/>
			<AsideMenuItem
				to='/master/fwg'
				Icon={faPeopleGroup}
				title='FWG'
			/>
			<AsideMenuItem
				to='/master/report'
				Icon={faFileLines}
				title='Report'
			/>
			<AsideMenuItemWithSub
				to=''
				title='Caller Desk'
				Icon={faPhoneAlt}>
				<AsideMenuItem
					to='/master/caller-desk-dashboard'
					title='Dashboard'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/master/caller-desk-reports'
					title='Call Logs'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>
			<AsideMenuItemWithSub
				to=''
				title='Personal Invoice'
				Icon={faFileInvoiceDollar}>
				<AsideMenuItem
					to='master-invoice/create'
					title='Create Invoice'
					hasBullet={true}
				/>
				{/* <AsideMenuItem
							to='master-invoice/list'
							title='Invoice List'
							hasBullet={true}
						/> */}
			</AsideMenuItemWithSub>
			<AsideMenuItemWithSub
				to=''
				title='Matrix'
				Icon={faBox}>
				<AsideMenuItem
					to='matrix-fwg'
					title='Matrix FWG'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='matrix-fgiit'
					title='Matrix FGIIT'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='matrix-gn'
					title='Matrix GN'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='matrix-hr'
					title='Matrix HR'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>
			{/* <AsideMenuItem
				to='/master/whatsapp-automation'
				Icon={faWhatsapp}
				title='Whatsapp Automation'
			/> */}
			<AsideMenuItem
				to='/master/facebook-automation'
				Icon={faFacebook}
				title='Facebook Automation'
			/>
			<AsideMenuItem
				to='/master/meta-marketing'
				Icon={faBullhorn}
				title='Meta Marketing'
			/>
			<AsideMenuItem
				to='/master/gls-report'
				Icon={faFileLines}
				title='GLS Report'
			/>
		</>
	)
}
