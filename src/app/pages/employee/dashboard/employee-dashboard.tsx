import { useState } from 'react'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GomziApprovedDashboard } from '../../../components/GomziApprovedDashboard'
import { TablesWidget } from './TablesWidget'
import { TaskNotification } from './TaskNotification'

const DashboardEmployee = () => {
	return (
		<>
			<PageTitle breadcrumbs={[]}>Dashboard</PageTitle>
			<GomziApprovedDashboard />
		</>
	)
}

export { DashboardEmployee }
