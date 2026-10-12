/* eslint-disable react/jsx-no-target-blank */
import { faCapsules, faFileInvoice, faJar } from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'

export function GomziMedicalDoctorAsideMenuItems() {
	return (
		<>
			<AsideMenuItem
				to='product'
				title='All Products'
				Icon={faJar}
			/>
			<AsideMenuItem
				to='order'
				title='Orders'
				Icon={faFileInvoice}
			/>
			<AsideMenuItem
				to='requirement-list'
				title='User Requirement'
				Icon={faCapsules}
			/>
		</>
	)
}
