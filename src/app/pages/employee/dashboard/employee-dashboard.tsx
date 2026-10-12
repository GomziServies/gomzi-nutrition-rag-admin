import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { useIntl } from 'react-intl'
import { PageTitle } from '../../../../_metronic/layout/core'
import { TablesWidget } from './TablesWidget'
import { TaskNotification } from './TaskNotification'

const DashboardPage = () => {
	return (
		<>
			{/* Overview */}
			<div className='row g-5 g-xl-5'>
				<div className='col-md-8'>
					<TablesWidget className='card-cl-stretch' />
				</div>
				<div className='col-md-4'>
					<TaskNotification className='' />
				</div>
			</div>
			{/* end::Overview */}
		</>
	)
}

const DashboardEmployee = () => {
	const intl = useIntl()
	return (
		<>
			<PageTitle breadcrumbs={[]}>Employee Dashboard</PageTitle>
			<DashboardPage />
		</>
	)
}

export { DashboardEmployee }
