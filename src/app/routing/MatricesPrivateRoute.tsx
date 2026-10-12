import { Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import { DashboardWrapper } from '../pages/master/dashboard/DashboardWrapper'
import FgiitMatrix from '../pages/master/matrix/fgiitmatrix'
import FwgMatrix from '../pages/master/matrix/fwgmatrix'
import GlsReport from '../pages/master/gls-report/gls-report'
import Gnmatrix from '../pages/master/matrix/gnmatrix'
import HrMatrix from '../pages/master/matrix/hrmatrix'

const MatricesPrivateRoute = () => {
	return (
		<Routes>
			<Route element={<MasterLayout />}>
				<Route
					path='matrix-fwg'
					element={<FwgMatrix />}
				/>
				<Route
					path='matrix-fgiit'
					element={<FgiitMatrix />}
				/>
				<Route
					path='matrix-gn'
					element={<Gnmatrix />}
				/>
				<Route
					path='matrix-hr'
					element={<HrMatrix />}
				/>
				<Route
					index
					element={<GlsReport />}
				/>
				<Route
					path='gls-report'
					element={<GlsReport />}
				/>
			</Route>
		</Routes>
	)
}

export { MatricesPrivateRoute }
