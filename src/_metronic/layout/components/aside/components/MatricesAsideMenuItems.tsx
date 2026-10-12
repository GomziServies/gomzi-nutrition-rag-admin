/* eslint-disable react/jsx-no-target-blank */
import { faFileLines, faChartSimple, faChartArea, faChartPie, faChartBar } from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'

export function MatricesAsideMenuItems() {
	return (
		<>
			<AsideMenuItem
				to='/matrices/gls-report'
				Icon={faFileLines}
				title='GLS Report'
			/>
			<AsideMenuItem
				to='/matrices/matrix-fwg'
				Icon={faChartSimple}
				title='Matrix FWG'
			/>
			<AsideMenuItem
				to='/matrices/matrix-fgiit'
				Icon={faChartArea}
				title='Matrix FGIIT'
			/>
			<AsideMenuItem
				to='/matrices/matrix-gn'
				Icon={faChartPie}
				title='Matrix GN'
			/>
			<AsideMenuItem
				to='/matrices/matrix-hr'
				Icon={faChartBar}
				title='Matrix HR'
			/>
		</>
	)
}
