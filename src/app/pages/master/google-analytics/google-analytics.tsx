import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { PageTitle } from '../../../../_metronic/layout/core'
import WebsiteSeo from '../../../../_metronic/partials/widgets/mixed/WebsiteSeo'

const MasterGoogleAnalytics = () => {
	return (
		<>
			<PageTitle breadcrumbs={[]}>Google Analytics</PageTitle>
			<div className='row g-5 g-xl-5'>
				<div className='col-12'>
					<WebsiteSeo
						className=''
						chartColor='primary'
						chartHeight='200px'
					/>
				</div>
			</div>
		</>
	)
}

export { MasterGoogleAnalytics }
