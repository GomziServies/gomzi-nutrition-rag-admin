/* eslint-disable react/jsx-no-target-blank */
import { faHome, faTags } from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'

export function TrainerAsideMenuItems() {
	return (
		<>
			<>
				<AsideMenuItem
					to='trainer/dashboard'
					Icon={faHome}
					title='Dashboard'
				/>
				<AsideMenuItem
					Icon={faTags}
					to='trainer-manage-coupon'
					title='Manage Coupon'
				/>
			</>
		</>
	)
}
