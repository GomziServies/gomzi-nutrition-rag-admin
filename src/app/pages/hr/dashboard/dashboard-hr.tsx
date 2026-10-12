import { useIntl } from 'react-intl'
import { PageTitle } from '../../../../_metronic/layout/core'
import { TablesWidget } from './TablesWidget'
import { TaskNotification } from './TaskNotification'
import { EmployeeAnniversaryTable } from './EmployeeAnniversaryTable'
import { ExpiredEmployeeTable } from './ExpiredEmployeeTable'

export const HRDashboardPage = () => {
	return (
		<>
			<EmployeeAnniversaryTable className='card-cl-stretch mb-5' />
			<ExpiredEmployeeTable className='card-cl-stretch mb-5' />
			{/* Overview */}
			<div className='row g-5 g-xl-5'>
				<div className='col-md-8 col-12'>
					<TablesWidget className='card-cl-stretch mb-5' />
				</div>
				<div className='col-md-4 col-12'>
					<TaskNotification className='' />
				</div>
			</div>
			{/* end::Overview */}
		</>
	)
}

const DashboardHR = () => {
	const intl = useIntl()
	return (
		<>
			<PageTitle breadcrumbs={[]}>HR Dashboard</PageTitle>
			<HRDashboardPage />
		</>
	)
}

export { DashboardHR }