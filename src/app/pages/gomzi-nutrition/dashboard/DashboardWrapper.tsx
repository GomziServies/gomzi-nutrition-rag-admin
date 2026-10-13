import React from 'react'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GomziApprovedDashboard } from '../../../components/GomziApprovedDashboard'

const GomziNutritionDashboard: React.FC = () => {
	return (
		<>
			<PageTitle breadcrumbs={[]}>Dashboard</PageTitle>
			<GomziApprovedDashboard />
		</>
	)
}

export { GomziNutritionDashboard }
