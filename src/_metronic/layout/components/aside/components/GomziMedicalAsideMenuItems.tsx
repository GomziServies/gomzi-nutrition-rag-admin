/* eslint-disable react/jsx-no-target-blank */
import {
	faCapsules,
	faCartArrowDown,
	faCartShopping,
	faJar,
	faUserCog,
	faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'

export function GomziMedicalAsideMenuItems() {
	return (
		<>
			<AsideMenuItem
				to='product'
				title='Products'
				Icon={faJar}
			/>
			<AsideMenuItem
				to='admin-user'
				Icon={faUserCog}
				title='Admin User'
			/>

			{/* Users start*/}
			<AsideMenuItem
				to='users'
				title='Users'
				Icon={faUsers}
			/>
			{/* Users End*/}

			{/* Orders start*/}
			<AsideMenuItem
				to='all-order'
				title='Orders'
				Icon={faCartArrowDown}
			/>
			{/* Orders End*/}

			{/* Cart start*/}
			<AsideMenuItem
				to='cart/add-to-cart'
				title='User Cart'
				Icon={faCartShopping}
			/>
			{/* Cart End*/}

			{/* Requirement start*/}
			<AsideMenuItem
				to='requirement-list'
				title='User Requirement'
				Icon={faCapsules}
			/>
			{/* Requirement End*/}
		</>
	)
}
