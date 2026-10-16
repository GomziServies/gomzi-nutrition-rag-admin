import React from 'react'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GomziNutritionRagDashboard } from './GomziNutritionRagDashboard'

const GomziNutritionDashboard: React.FC = () => {
	return (
		<>
			<PageTitle breadcrumbs={[]}>Commerce Dashboard</PageTitle>
			<GomziNutritionRagDashboard />
		</>
	)
}

export { GomziNutritionDashboard }
